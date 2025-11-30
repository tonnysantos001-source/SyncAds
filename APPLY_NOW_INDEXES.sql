-- ============================================
-- APPLY NOW - PERFORMANCE INDEXES
-- Simplified version for Dashboard execution
-- ============================================

-- users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan) WHERE plan IS NOT NULL;

-- orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- payments table
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- extension_commands table
CREATE INDEX IF NOT EXISTS idx_extension_commands_status ON extension_commands(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_extension_commands_user_id ON extension_commands(user_id);

-- chat_messages table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
  END IF;
END $$;

-- subscriptions table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status) WHERE status = 'active';
  END IF;
END $$;

-- gateway_configs table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gateway_configs') THEN
    CREATE INDEX IF NOT EXISTS idx_gateway_configs_user_id ON gateway_configs(user_id);
    CREATE INDEX IF NOT EXISTS idx_gateway_configs_active ON gateway_configs(is_active) WHERE is_active = true;
  END IF;
END $$;

-- Update statistics
ANALYZE users;
ANALYZE orders;
ANALYZE payments;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Performance indexes created successfully!';
END $$;
