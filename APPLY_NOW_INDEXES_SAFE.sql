-- ============================================
-- PERFORMANCE INDEXES - SAFE VERSION
-- Only creates indexes for existing tables
-- ============================================

-- Check and create indexes for orders
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    RAISE NOTICE '✅ Orders indexes created';
  END IF;
END $$;

-- Check and create indexes for payments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id) WHERE transaction_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    RAISE NOTICE '✅ Payments indexes created';
  END IF;
END $$;

-- Check and create indexes for extension_commands
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'extension_commands') THEN
    CREATE INDEX IF NOT EXISTS idx_extension_commands_status ON extension_commands(status) WHERE status = 'pending';
    CREATE INDEX IF NOT EXISTS idx_extension_commands_user_id ON extension_commands(user_id);
    RAISE NOTICE '✅ Extension commands indexes created';
  END IF;
END $$;

-- Check and create indexes for auth.users (Supabase auth table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);
    RAISE NOTICE '✅ Auth users indexes created';
  END IF;
END $$;

-- Check and create indexes for profiles (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
    RAISE NOTICE '✅ Profiles indexes created';
  END IF;
END $$;

-- Check and create indexes for subscriptions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status) WHERE status = 'active';
    RAISE NOTICE '✅ Subscriptions indexes created';
  END IF;
END $$;

-- Check and create indexes for gateway_configs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gateway_configs') THEN
    CREATE INDEX IF NOT EXISTS idx_gateway_configs_user_id ON gateway_configs(user_id);
    CREATE INDEX IF NOT EXISTS idx_gateway_configs_active ON gateway_configs(is_active) WHERE is_active = true;
    RAISE NOTICE '✅ Gateway configs indexes created';
  END IF;
END $$;

-- Update statistics for existing tables
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

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '✅ Performance indexes applied successfully!';
  RAISE NOTICE 'Check the notices above to see which tables were indexed.';
END $$;
