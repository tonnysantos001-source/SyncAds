-- ============================================
-- SYNCADS - CORREÇÕES CRÍTICAS DO BANCO DE DADOS
-- Data: 29/10/2025
-- Ordem: DEVE SER EXECUTADO ANTES DAS OUTRAS MIGRATIONS
-- ============================================

-- ============================================
-- PARTE 1: ADICIONAR CAMPOS FALTANTES
-- ============================================

-- 1.1: GlobalAiConnection.systemPrompt
-- Este campo é usado pelo chat-stream mas não existe no schema
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GlobalAiConnection' 
        AND column_name = 'systemPrompt'
    ) THEN
        ALTER TABLE "GlobalAiConnection" 
        ADD COLUMN "systemPrompt" TEXT;
        
        -- Adicionar valor padrão para registros existentes
        UPDATE "GlobalAiConnection" 
        SET "systemPrompt" = 'Você é um assistente de marketing digital inteligente e útil. Ajude os usuários com suas campanhas, análises e estratégias.'
        WHERE "systemPrompt" IS NULL;
        
        RAISE NOTICE '✅ Campo systemPrompt adicionado à GlobalAiConnection';
    ELSE
        RAISE NOTICE '⏭️  Campo systemPrompt já existe';
    END IF;
END $$;

-- 1.2: Product.isActive
-- Este campo é usado em várias queries mas não existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' 
        AND column_name = 'isActive'
    ) THEN
        ALTER TABLE "Product" 
        ADD COLUMN "isActive" BOOLEAN DEFAULT true;
        
        -- Ativar todos os produtos existentes
        UPDATE "Product" 
        SET "isActive" = true 
        WHERE "isActive" IS NULL;
        
        RAISE NOTICE '✅ Campo isActive adicionado à Product';
    ELSE
        RAISE NOTICE '⏭️  Campo isActive já existe';
    END IF;
END $$;

-- ============================================
-- PARTE 2: CRIAR FUNÇÃO is_service_role()
-- ============================================

-- Esta função é usada em RLS policies mas não existe
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = 'service_role';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

COMMENT ON FUNCTION is_service_role() IS 
'Verifica se o usuário atual é service_role (usado em RLS policies)';

-- ============================================
-- PARTE 3: ADICIONAR ÍNDICES EM FOREIGN KEYS
-- ============================================

-- Estes índices são CRÍTICOS para performance
-- Sem eles, queries com JOIN ficam 10-100x mais lentas

-- 3.1: Campaign.userId (usado em listagens de campanhas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_user 
ON "Campaign"("userId");

-- 3.2: CartItem.variantId (usado em checkout)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cartitem_variant 
ON "CartItem"("variantId");

-- 3.3: Lead.customerId (usado em marketing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_customer 
ON "Lead"("customerId");

-- 3.4: Order.cartId (usado em checkout/orders)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_cart 
ON "Order"("cartId");

-- 3.5: OrderItem.variantId (usado em relatórios de vendas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orderitem_variant 
ON "OrderItem"("variantId");

-- 3.6: Transaction.orderId (usado em pagamentos)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_order 
ON "Transaction"("orderId");

-- 3.7: Adicionar índices compostos para queries frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_org_status 
ON "Campaign"("organizationId", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_org_active 
ON "Product"("organizationId", "isActive");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_org_status 
ON "Order"("organizationId", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_gateway_status 
ON "Transaction"("gatewayId", "status");

-- ============================================
-- PARTE 4: TRIGGERS DE UPDATED_AT (se não existirem)
-- ============================================

-- Garantir que todas as tabelas críticas tenham trigger de updated_at
DO $$
DECLARE
    r RECORD;
    trigger_name TEXT;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updatedAt' 
        AND table_schema = 'public'
        AND table_name NOT LIKE 'pg_%'
    LOOP
        trigger_name := 'set_' || r.table_name || '_updated_at';
        
        -- Verificar se trigger já existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = trigger_name
        ) THEN
            -- Criar trigger
            EXECUTE format('
                CREATE TRIGGER %I
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION moddatetime(updatedAt);
            ', trigger_name, r.table_name);
            
            RAISE NOTICE '✅ Trigger % criado para %', trigger_name, r.table_name;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- VERIFICAÇÕES FINAIS
-- ============================================

-- Verificar se tudo foi criado corretamente
DO $$
DECLARE
    missing_fields INTEGER := 0;
    missing_function INTEGER := 0;
    missing_indexes INTEGER := 0;
BEGIN
    -- Verificar campos
    SELECT COUNT(*) INTO missing_fields
    FROM (
        SELECT 'GlobalAiConnection' as tbl, 'systemPrompt' as col
        UNION ALL
        SELECT 'Product', 'isActive'
    ) expected
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = expected.tbl
        AND column_name = expected.col
    );
    
    -- Verificar função
    SELECT COUNT(*) INTO missing_function
    FROM pg_proc 
    WHERE proname = 'is_service_role';
    
    IF missing_function = 0 THEN
        missing_function := 1;
    ELSE
        missing_function := 0;
    END IF;
    
    -- Verificar índices críticos
    SELECT COUNT(*) INTO missing_indexes
    FROM (
        SELECT 'idx_campaign_user' as idx
        UNION ALL SELECT 'idx_cartitem_variant'
        UNION ALL SELECT 'idx_lead_customer'
        UNION ALL SELECT 'idx_order_cart'
        UNION ALL SELECT 'idx_orderitem_variant'
        UNION ALL SELECT 'idx_transaction_order'
    ) expected
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = expected.idx
    );
    
    -- Reportar resultados
    IF missing_fields > 0 THEN
        RAISE WARNING '⚠️  Faltam % campos', missing_fields;
    ELSE
        RAISE NOTICE '✅ Todos os campos foram adicionados';
    END IF;
    
    IF missing_function > 0 THEN
        RAISE WARNING '⚠️  Função is_service_role() não foi criada';
    ELSE
        RAISE NOTICE '✅ Função is_service_role() criada';
    END IF;
    
    IF missing_indexes > 0 THEN
        RAISE WARNING '⚠️  Faltam % índices', missing_indexes;
    ELSE
        RAISE NOTICE '✅ Todos os índices foram criados';
    END IF;
    
    IF missing_fields = 0 AND missing_function = 0 AND missing_indexes = 0 THEN
        RAISE NOTICE '🎉 TODAS AS CORREÇÕES APLICADAS COM SUCESSO!';
    END IF;
END $$;

