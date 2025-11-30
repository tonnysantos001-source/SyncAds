-- ============================================
-- PERFORMANCE INDEXES MIGRATION
-- Data: 2025-01-26
-- Objetivo: Otimizar queries mais comuns
-- ============================================

-- ==========================================
-- ÍNDICES PARA TABELA users
-- ==========================================

-- Índice para busca por email (login)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
ON users(email);

-- Índice para busca por plano (queries de features)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_plan
ON users(plan)
WHERE plan IS NOT NULL;

-- Índice para usuários ativos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active
ON users(created_at DESC)
WHERE deleted_at IS NULL;

-- ==========================================
-- ÍNDICES PARA TABELA orders
-- ==========================================

-- Índice para busca de pedidos por usuário
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id
ON orders(user_id);

-- Índice composto para queries de pedidos ativos por usuário
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status
ON orders(user_id, status)
WHERE status NOT IN ('cancelled', 'expired');

-- Índice para busca por status (dashboard admin)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status
ON orders(status);

-- Índice para ordenação por data (listagens)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at
ON orders(created_at DESC);

-- Índice para pedidos pendentes (processamento)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_pending
ON orders(created_at DESC)
WHERE status = 'pending';

-- Índice para valor total (relatórios)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_total_amount
ON orders(total_amount)
WHERE total_amount > 0;

-- ==========================================
-- ÍNDICES PARA TABELA payments
-- ==========================================

-- Índice para busca de pagamentos por pedido
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_order_id
ON payments(order_id);

-- Índice para busca por transaction_id (webhooks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_transaction_id
ON payments(transaction_id)
WHERE transaction_id IS NOT NULL;

-- Índice para busca por gateway_transaction_id (webhooks externos)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_gateway_transaction_id
ON payments(gateway_transaction_id)
WHERE gateway_transaction_id IS NOT NULL;

-- Índice para pagamentos por status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status
ON payments(status);

-- Índice para pagamentos por gateway (relatórios)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_gateway
ON payments(gateway_name)
WHERE gateway_name IS NOT NULL;

-- Índice composto para queries de pagamentos pendentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_pending
ON payments(created_at DESC)
WHERE status = 'pending';

-- ==========================================
-- ÍNDICES PARA TABELA extension_commands
-- ==========================================

-- Índice para comandos pendentes (polling da extensão)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_extension_commands_status
ON extension_commands(status, created_at)
WHERE status = 'pending';

-- Índice para comandos por usuário
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_extension_commands_user_id
ON extension_commands(user_id);

-- Índice para comandos por device
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_extension_commands_device_id
ON extension_commands(device_id)
WHERE device_id IS NOT NULL;

-- Índice para limpeza de comandos antigos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_extension_commands_cleanup
ON extension_commands(created_at)
WHERE status IN ('completed', 'failed', 'cancelled');

-- ==========================================
-- ÍNDICES PARA TABELA chat_messages
-- ==========================================

-- Índice para mensagens por usuário
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_user_id
ON chat_messages(user_id);

-- Índice para mensagens por conversation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_conversation
ON chat_messages(conversation_id, created_at)
WHERE conversation_id IS NOT NULL;

-- Índice para ordenação temporal
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_created_at
ON chat_messages(created_at DESC);

-- ==========================================
-- ÍNDICES PARA TABELA shopify_integrations
-- ==========================================

-- Índice para busca por usuário
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shopify_integrations_user_id
ON shopify_integrations(user_id)
WHERE user_id IS NOT NULL;

-- Índice para busca por shop_domain
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shopify_integrations_shop_domain
ON shopify_integrations(shop_domain)
WHERE shop_domain IS NOT NULL;

-- Índice para integrações ativas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shopify_integrations_active
ON shopify_integrations(shop_domain, updated_at DESC)
WHERE access_token IS NOT NULL;

-- ==========================================
-- ÍNDICES PARA TABELA subscriptions
-- ==========================================

-- Índice para assinaturas por usuário
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_id
ON subscriptions(user_id)
WHERE user_id IS NOT NULL;

-- Índice para assinaturas ativas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_active
ON subscriptions(status)
WHERE status = 'active';

-- Índice para renovações próximas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_renewal
ON subscriptions(next_billing_date)
WHERE status = 'active' AND next_billing_date IS NOT NULL;

-- ==========================================
-- ÍNDICES PARA TABELA gateway_configs
-- ==========================================

-- Índice para busca de gateways por usuário
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gateway_configs_user_id
ON gateway_configs(user_id)
WHERE user_id IS NOT NULL;

-- Índice para gateways ativos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gateway_configs_active
ON gateway_configs(gateway_name, is_active)
WHERE is_active = true;

-- ==========================================
-- ÍNDICES PARA TABELA ai_conversations
-- ==========================================

-- Índice para conversas por usuário
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_conversations_user_id
ON ai_conversations(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Índice para conversas ativas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_conversations_active
ON ai_conversations(updated_at DESC)
WHERE archived = false OR archived IS NULL;

-- ==========================================
-- ÍNDICES PARA TABELA integrations
-- ==========================================

-- Índice para integrações por usuário
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integrations_user_id
ON integrations(user_id)
WHERE user_id IS NOT NULL;

-- Índice para integrações por plataforma
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integrations_platform
ON integrations(platform)
WHERE platform IS NOT NULL;

-- Índice composto para integrações ativas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integrations_user_platform_active
ON integrations(user_id, platform, is_active)
WHERE is_active = true;

-- ==========================================
-- ÍNDICES PARA TABELA audit_logs
-- ==========================================

-- Índice para logs por usuário
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id
ON audit_logs(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Índice para logs por ação
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action
ON audit_logs(action, created_at DESC)
WHERE action IS NOT NULL;

-- Índice para limpeza de logs antigos (retention policy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_cleanup
ON audit_logs(created_at)
WHERE created_at < NOW() - INTERVAL '90 days';

-- ==========================================
-- ÍNDICES PARA FULL TEXT SEARCH
-- ==========================================

-- Índice GIN para busca em produtos (se existir tabela products)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search
             ON products USING gin(to_tsvector(''portuguese'', name || '' '' || COALESCE(description, '''')))';
  END IF;
END $$;

-- ==========================================
-- ANÁLISE DAS TABELAS
-- ==========================================

-- Atualizar estatísticas para o otimizador de queries
ANALYZE users;
ANALYZE orders;
ANALYZE payments;
ANALYZE extension_commands;
ANALYZE chat_messages;
ANALYZE subscriptions;
ANALYZE gateway_configs;
ANALYZE ai_conversations;
ANALYZE integrations;
ANALYZE audit_logs;

-- ==========================================
-- COMENTÁRIOS
-- ==========================================

COMMENT ON INDEX idx_users_email IS 'Otimiza login e busca por email';
COMMENT ON INDEX idx_orders_user_id IS 'Otimiza queries de pedidos por usuário';
COMMENT ON INDEX idx_orders_status IS 'Otimiza filtros por status no dashboard';
COMMENT ON INDEX idx_payments_transaction_id IS 'Otimiza lookup de pagamentos em webhooks';
COMMENT ON INDEX idx_extension_commands_status IS 'Otimiza polling de comandos pendentes pela extensão';
COMMENT ON INDEX idx_subscriptions_renewal IS 'Otimiza job de renovação de assinaturas';

-- ==========================================
-- VERIFICAÇÃO
-- ==========================================

-- Query para verificar índices criados
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully!';
  RAISE NOTICE 'Total indexes added: %', (
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE indexname LIKE 'idx_%'
    AND schemaname = 'public'
  );
END $$;
