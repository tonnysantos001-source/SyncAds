-- Migration: Create modular gateways architecture with parallel coexistence
-- Date: 2026-06-19

-- 1. Criar a nova tabela payment_gateways
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  "logoUrl" TEXT,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'PAYMENT_PROCESSOR',
  "supportsPix" BOOLEAN DEFAULT false,
  "supportsCreditCard" BOOLEAN DEFAULT false,
  "supportsBoleto" BOOLEAN DEFAULT false,
  "supportsDebit" BOOLEAN DEFAULT false,
  "requiredFields" JSONB,
  "webhookUrl" TEXT,
  documentation TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "isPopular" BOOLEAN DEFAULT false,
  implemented BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela payment_gateways
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Criar política de leitura pública para payment_gateways (necessário para checkout público e painel)
CREATE POLICY "Allow public read access to payment_gateways"
  ON public.payment_gateways FOR SELECT
  USING (true);

-- 2. Copiar os dados existentes da tabela "Gateway" para "payment_gateways"
-- Mantendo exatamente os mesmos IDs para retrocompatibilidade
INSERT INTO public.payment_gateways (
  id, name, slug, "logoUrl", description, type, 
  "supportsPix", "supportsCreditCard", "supportsBoleto", "supportsDebit", 
  "requiredFields", "webhookUrl", documentation, "isActive", "isPopular", 
  "createdAt", "updatedAt", implemented
)
SELECT 
  id, name, slug, "logoUrl", description, type, 
  "supportsPix", "supportsCreditCard", "supportsBoleto", "supportsDebit", 
  "requiredFields", "webhookUrl", documentation, "isActive", "isPopular", 
  "createdAt", "updatedAt",
  CASE 
    WHEN slug IN ('asaas', 'mercado-pago', 'mercadopago', 'pagseguro', 'pagarme') THEN true 
    ELSE false 
  END as implemented
FROM public."Gateway"
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  "logoUrl" = EXCLUDED."logoUrl",
  description = EXCLUDED.description,
  "supportsPix" = EXCLUDED."supportsPix",
  "supportsCreditCard" = EXCLUDED."supportsCreditCard",
  "supportsBoleto" = EXCLUDED."supportsBoleto",
  "supportsDebit" = EXCLUDED."supportsDebit",
  "requiredFields" = EXCLUDED."requiredFields",
  implemented = EXCLUDED.implemented,
  "updatedAt" = now();

-- 3. Criar a tabela gateway_capabilities
CREATE TABLE IF NOT EXISTS public.gateway_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "gatewayId" UUID NOT NULL REFERENCES public.payment_gateways(id) ON DELETE CASCADE,
  "paymentMethod" TEXT NOT NULL,
  "isSupported" BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Habilitar RLS em gateway_capabilities
ALTER TABLE public.gateway_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to gateway_capabilities"
  ON public.gateway_capabilities FOR SELECT
  USING (true);

-- Inserir as capabilities iniciais para os gateways ativos
-- Asaas
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'pix', true FROM public.payment_gateways WHERE slug = 'asaas' ON CONFLICT DO NOTHING;
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'credit_card', true FROM public.payment_gateways WHERE slug = 'asaas' ON CONFLICT DO NOTHING;
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'boleto', true FROM public.payment_gateways WHERE slug = 'asaas' ON CONFLICT DO NOTHING;

-- Mercado Pago
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'pix', true FROM public.payment_gateways WHERE slug = 'mercado-pago' ON CONFLICT DO NOTHING;
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'credit_card', true FROM public.payment_gateways WHERE slug = 'mercado-pago' ON CONFLICT DO NOTHING;
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'boleto', true FROM public.payment_gateways WHERE slug = 'mercado-pago' ON CONFLICT DO NOTHING;

-- PagSeguro
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'pix', true FROM public.payment_gateways WHERE slug = 'pagseguro' ON CONFLICT DO NOTHING;
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'credit_card', true FROM public.payment_gateways WHERE slug = 'pagseguro' ON CONFLICT DO NOTHING;
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'debit_card', true FROM public.payment_gateways WHERE slug = 'pagseguro' ON CONFLICT DO NOTHING;
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'boleto', true FROM public.payment_gateways WHERE slug = 'pagseguro' ON CONFLICT DO NOTHING;

-- Pagar.me
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'pix', true FROM public.payment_gateways WHERE slug = 'pagarme' ON CONFLICT DO NOTHING;
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'credit_card', true FROM public.payment_gateways WHERE slug = 'pagarme' ON CONFLICT DO NOTHING;
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'debit_card', true FROM public.payment_gateways WHERE slug = 'pagarme' ON CONFLICT DO NOTHING;
INSERT INTO public.gateway_capabilities ("gatewayId", "paymentMethod", "isSupported")
SELECT id, 'boleto', true FROM public.payment_gateways WHERE slug = 'pagarme' ON CONFLICT DO NOTHING;


-- 4. Adicionar colunas paralelas nas tabelas existentes para coexistência
-- Tabela GatewayConfig
ALTER TABLE public."GatewayConfig" 
ADD COLUMN IF NOT EXISTS "paymentGatewayId" UUID REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'not_configured',
ADD COLUMN IF NOT EXISTS "lastHealthCheckAt" TIMESTAMP WITH TIME ZONE;

-- Tabela Transaction
ALTER TABLE public."Transaction"
ADD COLUMN IF NOT EXISTS "paymentGatewayId" UUID REFERENCES public.payment_gateways(id) ON DELETE SET NULL;

-- Tabela PaymentSplitLog
ALTER TABLE public."PaymentSplitLog"
ADD COLUMN IF NOT EXISTS "paymentGatewayId" UUID REFERENCES public.payment_gateways(id) ON DELETE SET NULL;

-- 5. Atualizar os dados para as novas colunas
UPDATE public."GatewayConfig" SET "paymentGatewayId" = "gatewayId" WHERE "paymentGatewayId" IS NULL;
UPDATE public."Transaction" SET "paymentGatewayId" = "gatewayId" WHERE "paymentGatewayId" IS NULL;
UPDATE public."PaymentSplitLog" SET "paymentGatewayId" = "gatewayId" WHERE "paymentGatewayId" IS NULL;


-- 6. Criar a tabela gateway_logs (enriquecida)
CREATE TABLE IF NOT EXISTS public.gateway_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  "userId" TEXT NOT NULL,
  "transactionId" UUID,
  request JSONB,
  response JSONB,
  status TEXT NOT NULL,
  "statusCode" INTEGER,
  "executionTime" INTEGER,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Habilitar RLS em gateway_logs
ALTER TABLE public.gateway_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on gateway_logs to authenticated users"
  ON public.gateway_logs FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId" OR EXISTS (
    SELECT 1 FROM public."User" WHERE id = auth.uid()::text AND "isSuperAdmin" = true
  ));

CREATE POLICY "Allow insert to system service_role/anon on gateway_logs"
  ON public.gateway_logs FOR INSERT
  WITH CHECK (true);


-- 7. Criar a tabela webhook_events (Fila)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway TEXT NOT NULL,
  "eventType" TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "errorMessage" TEXT,
  "processedAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Habilitar RLS em webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on webhook_events to super admins"
  ON public.webhook_events FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public."User" WHERE id = auth.uid()::text AND "isSuperAdmin" = true
  ));

CREATE POLICY "Allow insert webhook_events to anonymous/anyone"
  ON public.webhook_events FOR INSERT
  WITH CHECK (true);


-- 8. Recriar/Atualizar a função RPC get_active_gateways_for_checkout
CREATE OR REPLACE FUNCTION get_active_gateways_for_checkout(p_user_id text)
RETURNS TABLE (
  id uuid,
  "gatewayId" uuid,
  "paymentGatewayId" uuid,
  "isActive" boolean,
  "isDefault" boolean,
  environment text,
  priority integer,
  status text,
  gateway jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.id,
    gc."gatewayId",
    gc."paymentGatewayId",
    gc."isActive",
    gc."isDefault",
    gc.environment,
    gc.priority,
    gc.status,
    jsonb_build_object(
      'id', pg.id,
      'name', pg.name,
      'slug', pg.slug,
      'supportsPix', pg."supportsPix",
      'supportsCreditCard', pg."supportsCreditCard",
      'supportsBoleto', pg."supportsBoleto",
      'implemented', pg.implemented
    ) as gateway
  FROM "GatewayConfig" gc
  INNER JOIN "payment_gateways" pg ON pg.id = gc."paymentGatewayId"
  WHERE gc."userId" = p_user_id AND gc."isActive" = true AND pg.implemented = true;
END;
$$;

-- Grant execution to public so anonymous checkout users can call it
GRANT EXECUTE ON FUNCTION get_active_gateways_for_checkout(text) TO anon, authenticated;
