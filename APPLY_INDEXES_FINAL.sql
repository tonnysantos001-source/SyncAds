-- ============================================
-- PERFORMANCE INDEXES - FINAL VERSION
-- Only public schema tables (no auth schema)
-- ============================================

-- orders table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    RAISE NOTICE '✅ Orders indexes created';
  END IF;
END $$;

-- payments table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id) WHERE transaction_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    RAISE NOTICE '✅ Payments indexes created';
  END IF;
END $$;

-- extension_commands table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'extension_commands') THEN
    CREATE INDEX IF NOT EXISTS idx_extension_commands_status ON extension_commands(status) WHERE status = 'pending';
    CREATE INDEX IF NOT EXISTS idx_extension_commands_user_id ON extension_commands(user_id);
    RAISE NOTICE '✅ Extension commands indexes created';
  END IF;
END $$;

-- profiles table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
    RAISE NOTICE '✅ Profiles indexes created';
  END IF;
END $$;

-- subscriptions table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status) WHERE status = 'active';
    RAISE NOTICE '✅ Subscriptions indexes created';
  END IF;
END $$;

-- gateway_configs table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gateway_configs') THEN
    CREATE INDEX IF NOT EXISTS idx_gateway_configs_user_id ON gateway_configs(user_id);
    CREATE INDEX IF NOT EXISTS idx_gateway_configs_active ON gateway_configs(is_active) WHERE is_active = true;
    RAISE NOTICE '✅ Gateway configs indexes created';
  END IF;
END $$;

-- chat_messages table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
    RAISE NOTICE '✅ Chat messages indexes created';
  END IF;
END $$;

-- integrations table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integrations') THEN
    CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
    CREATE INDEX IF NOT EXISTS idx_integrations_platform ON integrations(platform);
    RAISE NOTICE '✅ Integrations indexes created';
  END IF;
END $$;

-- Update statistics
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    ANALYZE orders;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    ANALYZE payments;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'extension_commands') THEN
    ANALYZE extension_commands;
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 Performance indexes applied successfully!';
  RAISE NOTICE 'Your database is now optimized!';
END $$;
